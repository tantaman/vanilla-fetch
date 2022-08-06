import React from "react";
import dataSource from "./dataSource";
import Author from "./Author";
import Comments from "./Comments";

export default function Post({ data }) {
  if (data == null) {
    return null;
  }
  const post = data.post;
  console.log("render post");

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

Post.fetch = async (id) => {
  const commentsGen = Comments.fetch(id);
  let [post, comments] = await Promise.all([
    dataSource.post(id),
    commentsGen.next(),
  ]);
  comments = comments.value;

  return {
    post,
    _Comments: {
      prefetch: comments,
      generator: commentsGen,
    },
    _Author: await Author.fetch(id),
  };
};
