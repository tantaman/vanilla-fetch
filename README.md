# Apollo without the Apollo, Realy without the Relay

Something has been bothering me about `React` for quite some time. The complexity of data fetching in React apps is off the charts. The frequent pattern for data fetching is "fetch-on-render" which leads to an awful waterfalling user experience. Next, race conditions when fetching in effects is a common problem. Finally, getting the result of a `JavaScript` promise _always_ enqueues a micro task even if that promise is already resolved, resulting in flickering UIs.

> Note: Microtasks complete in the same browser frame but do not complete in the same React frame which causes these flickering issues. https://codesandbox.io/s/fast-fast-7zlfqt?file=/src/App.js  Trying to modify text at the start of the input results in your cursor jumping to the end of the input.

The last one was the last straw for me. It means any `async` data layer that does caching needs another cache atop but behind `synchronous` methods. If not, your render cycle (for React apps) is interrupted and your UI flashes various loading states.

> Note: React's weird and, imo, incorrect handling of microtasks is another reason to try and invest into WebComponents?

# Relay, Apollo

`Relay` and `Apollo` make all this a breeze. The way they pull fragments from components and craft a single query that can fulfill the data needs of an entire app is a true blessing. But the cost of adopting those can be prohibitive. Do I really need to GraphQL-ify my API just to get such a pleasent data fetching experience? What if I have _local state_ that is behind an async API? E.g., a `SQLite` connection, `IndexedDB` or `Origin Private Filesystem` storing data on-device for my app?

# Suspense

Suspense helps a lot with race conditions and gets us a bit closer to fixing "fetch-on-render". It doesn't, however, solve the problem of how to express all the data needs of a tree of components.

Suspense also has some warts. It requires a cache atop your existing caches.

> We don't intend to provide support for refreshing specific entries. The idea is that you refresh everything, and rely on an additional, backing cache layer — the browser request cache, a mutable data store, etc — to deduplicate requests - https://github.com/reactwg/react-18/discussions/25

Cache on a cache? What could go wrong.

# Vanilla JS

I started my career developing thick clients in `Java` and `C++`. Yea, `Java`. I'll probably be flamed for being a `Java` dev 🤷‍♂️. The `Java` culture is... over abstracted for sure. `Swing` and `AWT` and over-use of listeners and all that were totally convoluted.

But one thing we never had a problem with was data fetching. We relied strictly on language primitives to get all the data needed by the UI and it was always rather simple -- even if that data was across the network and/or we had to spawn new threads to get it.

Can't we go back to using language primitives for data fetching in `JS`?
- Can it be simple?
- Can it express the data needs for an entire tree of components?
- Can we kick off fetching before we kick off rendering while still localizing data fetching concerns with the components that need the data?
- Finally, can we allow our async APIs, which may have caching in them already, to keep the responsibility of caching and not duplicate it or move it?

The answer seems to be YES! We can do it all, and keep it all pretty simple, with vanilla `JS`.

# How It's Done

(view the complete demo: https://tantaman.com/vanilla-fetch/)

Each React component has a sibling `fetch` function.

```js
function Post() {
  ...
}

Post.fetch = async function(id) {
  ...
}
```

These sibling functions are responsible for fetching the data for the component and invoking the fetchers for child components. They are very similar in spirit to `Relay` or `Apollo` fragments but, rather than being written in `GraphQL`, they're just regular `JS`.

> fetching the data for that component and invoking the fetchers for child components

Lets see an example of this ([Post.js](https://github.com/tantaman/vanilla-fetch/blob/main/src/Post.js)):

```js
Post.fetch = async (id) => {
  const commentsGen = Comments.fetch(id);
  let [post, comments] = await Promise.all([
    dataSource.post(id),
    commentsGen.next(),
  ]);

  return {
    post,
    _Comments: {
      prefetch: comments.value,
      generator: commentsGen,
    },
    _Author: await Author.fetch(id),
  };
};
```

would gather data for:

```js
function Post({ data }) {
  const post = data.post;

  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        <Author author={data._Author} />
        <div>{post.body}</div>
      </article>
      <Comments comments={data._Comments} />
    </main>
  );
}
```

# Streaming & Changing Data

Of course not all data sources are done as soon as we're done fetching from them. Some data sources may stream results back to us over time.

To support that, we can define our fetch function as an `async generator`. You saw a preview of this above where `Post.fetch` referred to `generator: commentsGen`.

The following example ([Comments.js](https://github.com/tantaman/vanilla-fetch/blob/main/src/Comments.js)) fetches and streams the latest comments on a post, in realtime.

```js
function Comments({ comments }) {
  const allComments = useGenerator(comments.prefetch, comments.generator);
  return (
    <section>
      {allComments.map((c) => (
        <div key={c.id}>
          <span>{c.time.toLocaleTimeString()}</span>
          <p>{c.body}</p>
        </div>
      ))}
    </section>
  );
}

Comments.fetch = async function* (postId) {
  for await (const comments of dataSource.comments(postId)) {
    yield [...comments];
  }
};
```

# Fetch then Render

Doing this is pretty simple.

If you want to fetch some data for a component in response to some event (like a click), call that component's `fetch` function in the event.

Example ([App.js](https://github.com/tantaman/vanilla-fetch/blob/main/src/App.js)):

```js
function App() {
  const [postData, setPostData] = useState();
  ...
  <a onClick={async () => {setPostData(await Post.fetch(p.id));}}>Post Title</a>
  {postData ? <Post data={postData}> : null}
  ...
}
```

This begs the question, however, of how to show a loading state between the time the user clicks and the time the data arrives.

You could do the following:

```js
function App() {
  const [postData, setPostData] = useState();
  ...
  <a onClick={async () => {setLoading(true); setPostData(await Post.fetch(p.id)); setLoading(false)}}>Post Title</a>
  {loading ? 'loading...' : null}
  {!loading && postData ? <Post data={postData}> : null}
  ...
}
```

But.. what if the data is cached by `Post.fetch` already because you fetched it before? The above pattern will flash a loading indicator right before showing the post. This is because `await` always enqueues a micro task -- even if the thing awaited is done.

# Stop the Flicker

This one might be controversial but I think a valid approach is to not show a loading indicator until the data being loaded has taken more than a specific amount of time.

If we wait ~25ms to show the loading indicator then it will never be shown when we fetch cached data from our data source.

This is done in [App.js](https://github.com/tantaman/vanilla-fetch/blob/main/src/App.js).

# Deferred Fetching & Render-as-you-fetch

From the generator example, hopefully its pretty straightforward to see how to do defer fetching. Either return a promise or return a geneartor with no "initial" state.

Render-as-you-fetch requires suspense to handle it well. todo.

# Other

- I've never used `Vue` but this `fetch as sibling` makes the view much "dumber" and much more akin to templates that were used back in the day. Seems like a good fit for `Vue`.
- This little repository is an exploration of those questions before making data fetching pattern recommendations for https://aphrodite.sh users.

Completed demo: https://tantaman.com/vanilla-fetch/
