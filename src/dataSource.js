import randomWords from "random-words";

const posts = [
  {
    id: 0,
    title: "Relay without the Relay",
    authorId: 1,
    body: randomWords({ exactly: 250, join: " " }),
  },
  {
    id: 1,
    title: "Apollo without the Apollo",
    authorId: 1,
    body: randomWords({ exactly: 125, join: " " }),
  },
  {
    id: 2,
    title: "Suspense without the Suespense",
    authorId: 1,
    body: randomWords({ exactly: 350, join: " " }),
  },
];
let commentId = 0;

// The data source could be memoized in a production app.
export default {
  async post(id) {
    if (postCache[id]) {
      return postCache[id];
    }
    // Simulate network fetch
    await new Promise((resolve) => setTimeout(resolve, 300));
    postCache[id] = posts[id];
    return posts[id];
  },

  async *comments(postId) {
    // put a cache in front to show that we can cache in the async data layer
    // and still prevent loading statuses.
    if (commentsCache[postId]) {
      yield commentsCache[postId];
    }

    while (true) {
      // Simulate network fetch
      await new Promise((resolve) => setTimeout(resolve, 750));
      console.log("yield for " + postId);

      const comment = {
        id: commentId++,
        time: new Date(),
        body: randomWords({
          exactly: 10 + Math.floor(Math.random() * 35),
          join: " ",
        }),
      };

      let existing = commentsCache[postId];
      if (!existing) {
        existing = [];
        commentsCache[postId] = existing;
      }
      existing.push(comment);
      if (existing.length > 10) {
        commentsCache[postId] = existing.slice(
          existing.length - 10,
          existing.length
        );
      }
      yield existing;
    }
  },

  async user(id) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      name: "Tantaman",
      img: "",
    };
  },

  clearCaches() {
    postCache = {};
    commentsCache = {};
    userCache = {};
  },
};

let postCache = {};
let commentsCache = {};
let userCache = {};
