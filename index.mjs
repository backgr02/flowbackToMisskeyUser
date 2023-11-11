import * as Misskey from "misskey-js";

const misskeyAPIClient = new Misskey.api.APIClient({
  origin: process.env.MISSKEY_URI,
  credential: process.env.MISSKEY_TOKEN,
});

export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if ("body" in event) {
      const body = JSON.parse(event.body);
      console.log(JSON.stringify(body));
      if (body.type === "followed") {
        response = await misskeyAPIClient.request("following/create", {
          userId: body.body.user.id,
        });
      } else if (body.type === "renote") {
        response = await misskeyAPIClient.request("following/create", {
          userId: body.body.note.user.id,
        });
      } else {
        response = { message: body.type };
      }
    } else {
      response = { message: "no body" };
    }

    console.log(JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify(err.message, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  }
};
