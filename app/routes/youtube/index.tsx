import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";

const filePath = "youtube.txt";
async function readYoutube() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0")
  );
}

const getYoutube = createServerFn({ method: "GET" }).handler(() => {
  return readYoutube();
});

const inputYoutube = createServerFn({ method: "POST" })
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    await readYoutube();
    await fs.promises.writeFile(filePath, `${data}`);
  });

export const Route = createFileRoute("/youtube/")({
  component: Youtube,
  loader: async () => await getYoutube(),
});
function Youtube() {
  const router = useRouter();
  const state = Route.useLoaderData();
  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => {
            inputYoutube({
              data: "https://www.youtube.com/watch?v=r8Dg0KVnfMA",
            }).then(() => {
              router.invalidate();
            });
          }}
        >
          Get Description
        </button>
        <input className="input" type="text" />
      </div>
    </>
  );
}
