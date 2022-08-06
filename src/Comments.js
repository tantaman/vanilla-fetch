import React from "react";
import dataSource from "./dataSource";
import useGenerator from "./useGenerator";

export default function Comments({ comments }) {
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
