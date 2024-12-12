import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import VideoDetail from "../../components/VideoDetail";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import * as fs from "node:fs";

const filePath = "youtube.txt";
// Server function to read the file content
const getYoutubeURL = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const url = await fs.promises.readFile(filePath, "utf-8");
    return url.trim(); // Trim whitespace for clean URLs
  } catch (error) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      // Fallback URL if the file doesn't exist
      return "https://www.youtube.com/watch?v=zRs58D34OLY";
    }
    throw new Error("An unexpected error occurred while reading youtube.txt");
  }
});

const updateURL = createServerFn({ method: "POST" })
  .validator((data: string) => data.trim())
  .handler(async ({ data }) => {
    await fs.promises.writeFile(filePath, data.trim(), "utf-8");
  });

export const Route = createFileRoute("/youtube/")({
  component: Youtube,
  loader: async () => await getYoutubeURL(),
});

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

async function fetchDetails() {
  const url = await getYoutubeURL();
  const formattedUrl = new URL(url.trim());
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

  const rawDate = new Date(video.publishedAt);
  const day = String(rawDate.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    rawDate
  );
  const year = rawDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return {
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnail: video.thumbnails.medium.url,
    publishedAt: formattedDate,
  };
}

function Youtube() {
  const router = useRouter();
  const state = Route.useLoaderData();

  const queryClient = useQueryClient();
  const [inputURL, setInputURL] = useState("");

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

  const handleURL = () => {
    mutation.mutate({ data: inputURL });
    setInputURL("");
  };

  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error)
    return (
      <>
        <div>
          <input
            type="text"
            value={inputURL}
            onChange={(e) => setInputURL(e.target.value)}
            placeholder="Enter YouTube URL"
          />
          <button onClick={handleURL}>Submit</button>
        </div>
        <br />
        <p>No video details available</p> <br /> <p>Reason: {error.message}</p>
      </>
    );

  return (
    <>
      <div>
        <input
          type="text"
          value={inputURL}
          onChange={(e) => setInputURL(e.target.value)}
          placeholder="Enter YouTube URL"
        />
        <button onClick={handleURL}>Submit</button>
      </div>

      <br />

      <VideoDetail
        title={data?.title}
        channelTitle={data?.channelTitle}
        thumbnail={data?.thumbnail}
        publishedAt={data?.publishedAt}
      />
    </>
  );
}
