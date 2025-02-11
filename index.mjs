import * as Misskey from "misskey-js";

// 環境変数の検証
const requiredEnvVars = [
  "MISSKEY_IO_HOST",
  "MISSKEY_IO_TOKEN",
  "NIJIMISS_MOE_HOST",
  "NIJIMISS_MOE_TOKEN",
  "NINEVERSE_COM_HOST",
  "NINEVERSE_COM_TOKEN",
  "MISSKEY_SYSTEMS_HOST",
  "MISSKEY_SYSTEMS_TOKEN",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
});

// Misskeyアカウントの作成
const misskeyAccount = (main, host, token) => {
  console.log("misskeyAccount host=" + host);
  return {
    main: main,
    apiClient: new Misskey.api.APIClient({ origin: `https://${host}`, credential: token }),
  };
};

const misskeyAccounts = [
  misskeyAccount(true, process.env.MISSKEY_IO_HOST, process.env.MISSKEY_IO_TOKEN),
  // Error: certificate has expired
  // misskeyAccount(true, process.env.BACKSPACE_FM_HOST, process.env.BACKSPACE_FM_TOKEN),
  misskeyAccount(false, process.env.NIJIMISS_MOE_HOST, process.env.NIJIMISS_MOE_TOKEN),
  misskeyAccount(false, process.env.NINEVERSE_COM_HOST, process.env.NINEVERSE_COM_TOKEN),
  misskeyAccount(false, process.env.MISSKEY_SYSTEMS_HOST, process.env.MISSKEY_SYSTEMS_TOKEN),
];

// ユーザー検索関数
const searchUser = async (event, body, account, search) => {
  if (body.type === "followed") {
    if (`https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
      return body.body.user;
    } else {
      return await search(body.body.user);
    }
  } else if (body.type === "renote") {
    if (`https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
      return body.body.note.user;
    } else {
      return await search(body.body.note.user);
    }
  }
  throw new Error(`Unknown type: ${body.type}`);
};

// フォロー作成関数
async function createFollowing(event, body, account) {
  const user = await searchUser(event, body, account, async (user) => {
    console.log("search start: " + JSON.stringify(user));
    const users = await account.apiClient.request("users/search-by-username-and-host", {
      username: user.username,
      host: user.host,
      limit: 1,
      detail: false,
    });
    console.log("search end: " + JSON.stringify(users));
    return users[0];
  });
  console.log("user: " + JSON.stringify(user));
  await account.apiClient.request("following/create", { userId: user.id });
}

// リアクション作成関数
const reactionsMap = {
  ":ohayoo:": ":ohayoo:",
  ありがとうございます: ":kotira_koso:",
};

async function createReactions(_event, body, account) {
  console.log("createReactions: note=" + JSON.stringify(body.body.note));
  const text = body.body.note.text;
  for (const [keyword, reaction] of Object.entries(reactionsMap)) {
    if (text.includes(keyword)) {
      try {
        const create = await account.apiClient.request("notes/reactions/create", {
          noteId: body.body.note.id,
          reaction: reaction,
        });
        console.log(`Reaction '${reaction}' created for keyword '${keyword}': ${JSON.stringify(create)}`);
      } catch (error) {
        console.error(`Failed to create reaction '${reaction}' for keyword '${keyword}': ${error}`);
      }
      break;
    }
  }
}

// イベントハンドラー
export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if ("body" in event) {
      const body = JSON.parse(event.body);
      console.log(JSON.stringify(body));
      for (const account of misskeyAccounts) {
        if (account.main || `https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
          console.log("run: " + account.apiClient.origin);
          try {
            if (body.type === "followed" || body.type === "renote") {
              await createFollowing(event, body, account);
            } else if (body.type === "mention") {
              await createReactions(event, body, account);
            }
          } catch (e) {
            console.log("error: " + account.apiClient.origin);
            console.log(e);
          }
        }
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
