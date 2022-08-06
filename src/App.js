import "./App.css";
import { useState } from "react";
import React from "react";
import Post from "./Post";

export default function App() {
  const postSummaries = [
    {
      id: 0,
      title: "Relay without the Relay",
    },
    {
      id: 1,
      title: "Apollo without the Apollo",
    },
    {
      id: 2,
      title: "Suspense without... the Suspense",
    },
  ];

  const [postData, setPostData] = useState();

  return (
    <div className="App">
      <button onClick={() => setPostData(null)}>clear</button>
      <ul>
        {postSummaries.map((p) => (
          <li
            key={p.id}
            onClick={async () => {
              // we could show a loading screen if the fetch takes longer than 50ms
              setPostData(await Post.fetch(p.id));
            }}
          >
            <a href="#">{p.title}</a>
          </li>
        ))}
      </ul>
      <Post data={postData} />
    </div>
  );
}
