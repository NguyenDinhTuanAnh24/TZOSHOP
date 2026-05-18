/* eslint-disable @typescript-eslint/no-explicit-any */
const NEWAPI_BASE_URL = process.env.NEWAPI_BASE_URL || "http://localhost:3000";
const NEWAPI_ADMIN_KEY = process.env.NEWAPI_ADMIN_KEY;

// Root user id on NewAPI
const NEWAPI_USER_ID_HEADER = "1";
const JSON_CONTENT_TYPE = "application/json";

type NewApiRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function getAdminKeyOrThrow() {
  const raw = NEWAPI_ADMIN_KEY?.trim();
  if (!raw) {
    throw new Error("NewAPI configuration is missing: NEWAPI_ADMIN_KEY is not defined.");
  }
  return raw;
}

function buildNewApiHeaders(adminKey: string, authMode: "bearer" | "raw", extra?: Record<string, string>) {
  return {
    Authorization: authMode === "bearer" ? `Bearer ${adminKey}` : adminKey,
    "Content-Type": JSON_CONTENT_TYPE,
    "New-Api-User": NEWAPI_USER_ID_HEADER,
    ...(extra || {}),
  };
}

async function newApiAdminFetch(path: string, init: NewApiRequestInit = {}) {
  const adminKey = getAdminKeyOrThrow();
  const url = `${NEWAPI_BASE_URL}${path}`;

  // Primary auth is Bearer; fallback to raw token for deployments that require it.
  const tryModes: Array<"bearer" | "raw"> = ["bearer", "raw"];
  let lastResponse: Response | null = null;

  for (const mode of tryModes) {
    const res = await fetch(url, {
      ...init,
      headers: buildNewApiHeaders(adminKey, mode, init.headers),
    });

    lastResponse = res;
    if (res.ok || res.status !== 401) {
      return res;
    }
  }

  return lastResponse as Response;
}

/**
 * Create a token in NewAPI for a specific CreditBucket plan.
 */
export async function createNewApiToken(input: {
  name: string;
  group: string;
  expiredAt: Date | null;
  creditsRemaining: number;
  allowedModels: string[];
}) {
  const { name, group, expiredAt, creditsRemaining, allowedModels } = input;
  const expiredTime = expiredAt ? Math.floor(expiredAt.getTime() / 1000) : -1;
  const remainQuota = Math.floor(creditsRemaining * 500000);

  // 1) Create token
  const createRes = await newApiAdminFetch("/api/token/", {
    method: "POST",
    body: JSON.stringify({
      name,
      group,
      expired_time: expiredTime,
      remain_quota: remainQuota,
      unlimited_quota: false,
      model_limits_enabled: allowedModels.length > 0,
      model_limits: allowedModels.join(","),
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create token in NewAPI: ${createRes.status} ${createRes.statusText} - ${errText}`);
  }

  const createJson = await createRes.json();
  if (!createJson.success) {
    throw new Error(`NewAPI returned error during token creation: ${createJson.message || "Unknown error"}`);
  }

  // 2) Search newly created token by name
  const searchRes = await newApiAdminFetch(`/api/token/search?keyword=${encodeURIComponent(name)}`, {
    method: "GET",
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to search token in NewAPI: ${searchRes.status} ${searchRes.statusText}`);
  }

  const searchJson = await searchRes.json();
  if (!searchJson.success) {
    throw new Error(`NewAPI returned error during token search: ${searchJson.message || "Unknown error"}`);
  }

  let tokens: any[] = [];
  if (Array.isArray(searchJson.data)) {
    tokens = searchJson.data;
  } else if (searchJson.data && Array.isArray(searchJson.data.items)) {
    tokens = searchJson.data.items;
  } else if (searchJson.data && Array.isArray(searchJson.data.data)) {
    tokens = searchJson.data.data;
  } else {
    console.log("[NewAPI Search Response Structure]:", JSON.stringify(searchJson));
  }

  const foundToken = tokens.find((t: any) => t.name === name);
  if (!foundToken) {
    throw new Error(`Could not find the newly created token with name "${name}" in NewAPI search results.`);
  }

  const tokenId = foundToken.id;

  // 3) Get real full API key
  const keyRes = await newApiAdminFetch(`/api/token/${tokenId}/key`, {
    method: "POST",
  });

  if (!keyRes.ok) {
    throw new Error(`Failed to fetch token key from NewAPI: ${keyRes.status} ${keyRes.statusText}`);
  }

  const keyJson = await keyRes.json();
  if (!keyJson.success || !keyJson.data || !keyJson.data.key) {
    throw new Error(`NewAPI returned error during key retrieval: ${keyJson.message || "Key not found in data"}`);
  }

  return {
    id: tokenId,
    key: keyJson.data.key as string,
  };
}

/**
 * Revoke/delete token in NewAPI.
 */
export async function revokeNewApiToken(tokenId: number) {
  const res = await newApiAdminFetch(`/api/token/${tokenId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete token in NewAPI: ${res.status} ${res.statusText} - ${errText}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(`NewAPI returned error during token deletion: ${json.message || "Unknown error"}`);
  }

  return true;
}

/**
 * Revoke token by searching with unmasked API key (sk-...).
 */
export async function revokeNewApiTokenByKey(fullKey: string) {
  try {
    const keyToSearch = fullKey.startsWith("sk-") ? fullKey.slice(3) : fullKey;

    const searchRes = await newApiAdminFetch(`/api/token/search?token=${encodeURIComponent(keyToSearch)}`, {
      method: "GET",
    });

    if (!searchRes.ok) {
      console.error(`Failed to search token by key in NewAPI: ${searchRes.status} ${searchRes.statusText}`);
      return false;
    }

    const searchJson = await searchRes.json();
    if (!searchJson.success) {
      console.error(`NewAPI returned error during search by key: ${searchJson.message}`);
      return false;
    }

    let tokens: any[] = [];
    if (Array.isArray(searchJson.data)) {
      tokens = searchJson.data;
    } else if (searchJson.data && Array.isArray(searchJson.data.items)) {
      tokens = searchJson.data.items;
    } else if (searchJson.data && Array.isArray(searchJson.data.data)) {
      tokens = searchJson.data.data;
    }

    if (tokens.length === 0) {
      console.warn("No token found in NewAPI with the matching key. Skipping NewAPI revocation.");
      return false;
    }

    const tokenId = tokens[0].id;
    return await revokeNewApiToken(tokenId);
  } catch (error) {
    console.error("Failed to revoke token on NewAPI by key:", error);
    return false;
  }
}

/**
 * Fetch token details from NewAPI by full key.
 */
export async function getNewApiTokenByKey(fullKey: string) {
  try {
    const keyToSearch = fullKey.startsWith("sk-") ? fullKey.slice(3) : fullKey;

    const searchRes = await newApiAdminFetch(`/api/token/search?token=${encodeURIComponent(keyToSearch)}`, {
      method: "GET",
    });

    if (!searchRes.ok) {
      console.error(`Failed to fetch token by key in NewAPI: ${searchRes.status} ${searchRes.statusText}`);
      return null;
    }

    const searchJson = await searchRes.json();
    if (!searchJson.success) {
      console.error(`NewAPI returned error during token fetch by key: ${searchJson.message}`);
      return null;
    }

    let tokens: any[] = [];
    if (Array.isArray(searchJson.data)) {
      tokens = searchJson.data;
    } else if (searchJson.data && Array.isArray(searchJson.data.items)) {
      tokens = searchJson.data.items;
    } else if (searchJson.data && Array.isArray(searchJson.data.data)) {
      tokens = searchJson.data.data;
    }

    if (tokens.length === 0) {
      return null;
    }

    const token = tokens[0];
    return {
      id: token.id,
      name: token.name,
      status: token.status,
      group: token.group,
      remainQuota: Number(token.remain_quota) / 500000,
      usedQuota: Number(token.used_quota) / 500000,
      unlimitedQuota: !!token.unlimited_quota,
      expiredTime: token.expired_time,
    };
  } catch (error) {
    console.error("Failed to get token details from NewAPI by key:", error);
    return null;
  }
}

/**
 * Fetch usage logs from NewAPI for a token.
 */
export async function getNewApiUsageLogs(tokenName: string) {
  try {
    const res = await newApiAdminFetch(`/api/log/?token_name=${encodeURIComponent(tokenName)}&size=100`, {
      method: "GET",
    });

    if (!res.ok) {
      console.error(`Failed to fetch logs from NewAPI: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    if (!json.success) {
      console.error(`NewAPI returned error during log fetch: ${json.message}`);
      return [];
    }

    const items = json.data?.items || json.data || [];
    return items.map((item: any) => ({
      id: item.id,
      createdAt: item.created_at,
      modelName: item.model_name,
      tokenName: item.token_name,
      promptTokens: Number(item.prompt_tokens || 0),
      completionTokens: Number(item.completion_tokens || 0),
      totalTokens: Number(item.prompt_tokens || 0) + Number(item.completion_tokens || 0),
      quota: Number(item.quota || 0),
      useTime: Number(item.use_time || 0),
      status: item.type === 2 ? "SUCCESS" : "FAILED",
    }));
  } catch (error) {
    console.error("Failed to get logs from NewAPI:", error);
    return [];
  }
}
