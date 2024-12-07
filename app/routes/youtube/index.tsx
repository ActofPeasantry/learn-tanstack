import { useState } from "react";
import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ROUTING-----------------------
const filePath = "youtube.txt";
async function readYoutube() {
  const url = await fs.promises.readFile(filePath, "utf-8");
  return url.trim();
}

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

const getYoutube = createServerFn({ method: "GET" }).handler(() => {
  return readYoutube();
});

const updateURL = createServerFn({ method: "POST" })
  .validator((data: string) => {
    if (!data.trim()) {
      throw new Error("URL cannot be empty");
    }
    return data;
  })
  .handler(async ({ data }) => {
    await fs.promises.writeFile(filePath, data.trim(), "utf-8");
  });

export const Route = createFileRoute("/youtube/")({
  component: Youtube,
  loader: async () => await getYoutube(),
});

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

// RENDERING
function Youtube() {
  const router = useRouter();
  const state = Route.useLoaderData();

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["videoDetails"],
    queryFn: fetchDetails,
  });

  const mutation = useMutation({
    mutationFn: updateURL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoDetails"] });
    },
  });

  const [inputURL, setInputURL] = useState("");
  const handleURL = () => {
    mutation.mutate({ data: inputURL }); // Send new URL to server
    setInputURL(""); // Clear input field
  };

  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;

  return (
    <>
      <div>
        <button type="button" onClick={handleURL}>
          Enter
        </button>
        <input
          className="input"
          type="text"
          value={inputURL}
          onChange={(e) => setInputURL(e.target.value)}
          placeholder="Enter URL"
        />
      </div>
      <br />
      <div>
        <h3>Title : {data?.title}</h3>
        <img src={data?.thumbnail} alt={data?.title} />
        <p>Published on: {data?.publishedAt}</p>
      </div>
    </>
  );
}
export default Youtube;
