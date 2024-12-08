import * as fs from "node:fs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";

// ROUTING-----------------------
const filePath = "youtube.txt";

// Server function to read the file content
const getYoutubeURL = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const url = await fs.promises.readFile(filePath, "utf-8");
    return url.trim(); // Trim whitespace for clean URLs
  } catch (error) {
    throw new Error("Failed to read youtube.txt");
  }
});

const updateURL = createServerFn({ method: "POST" }).validator(
  (data: string) => {
    if (!data.trim()) {
      throw new Error("URL cannot be empty");
    }
    return data;
  }
);

//API FETCHING-----------------
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
async function fetchDetails() {
  const url = await getYoutubeURL(); // Dynamically read the URL from the file
  const formattedUrl = new URL(url.trim()); // Trim whitespace from file content
  const videoId = formattedUrl.searchParams.get("v");
  if (!videoId) {
    throw new Error("Invalid YouTube URL or missing video ID");
  }
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const fetchedData = await response.json();
  const video = fetchedData.items[0]?.snippet;
  if (!video) {
    throw new Error("Video details not found");
  }

  const rawDate = new Date(video.publishedAt);
  const day = String(rawDate.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    rawDate
  ); // Full month name
  const year = rawDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return {
    title: video.title,
    thumbnail: video.thumbnails.medium.url,
    publishedAt: formattedDate,
  };
}

export function VideoDetails() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["videoDetails"],
    queryFn: fetchDetails,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <h3>Title : {data?.title}</h3>
      <img src={data?.thumbnail} alt={data?.title} />
      <p>Published on: {data?.publishedAt}</p>
    </div>
  );
}
