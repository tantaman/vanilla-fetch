import React from "react";
import dataSource from "./dataSource";
import Author from "./Author";
import Comments from "./Comments";

export default function Post({ data }) {
  if (data == null) {
    return null;
  }
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

Post.fetch = async (id) => {
  const commentsGen = Comments.fetch(id);
  const [post, comments] = await Promise.all([
    dataSource.post(id),
    commentsGen.next(),
  ]);

  return {
    post,
    _Comments: {
      prefetch: comments.value,
      generator: commentsGen,
    },
    _Author: await Author.fetch(post.authorId),
  };
};
