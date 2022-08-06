import React from "react";
import dataSource from "./dataSource";

export default function Author({ author }) {
  return <div>{author.name}</div>;
}

Author.fetch = async (authorId) => {
  return await dataSource.user(authorId);
};
