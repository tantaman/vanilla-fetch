import randomWords from "random-words";

const posts = [
  {
    id: 0,
    title: "Relay without the Relay",
    authorId: 1,
    body: "Lorem ipsum ipsum lorem",
  },
  {
    id: 1,
    title: "Apollo without the Apollo",
    authorId: 1,
    body: "Lorem ipsum ipsum lorem",
  },
  {
    id: 2,
    title: "Suspense without the Suespense",
    authorId: 1,
    body: "Lorem ipsum ipsum lorem",
  },
];
let commentId = 0;

// The data source could be memoized in a production app.
export default {
  async post(id) {
    // Simulate network fetch
    await new Promise((resolve) => setTimeout(resolve, 10));
    return posts[id];
  },

  async *comments(postId) {
    while (true) {
      // Simulate network fetch
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("yield for " + postId);
      yield {
        id: commentId++,
        time: new Date(),
        body: randomWords({ exactly: 25, join: " " }),
      };
    }
  },

  user(id) {},
};
