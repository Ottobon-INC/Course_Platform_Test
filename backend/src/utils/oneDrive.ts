import { env } from "../config/env";

let accessToken: string | null = null;
let tokenExpiry = 0;

export async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const { clientId, clientSecret, tenantId } = env.oneDrive;
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("OneDrive credentials not configured");
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get Microsoft Graph token: ${data.error_description || data.error}`);
  }

  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 300) * 1000; // Buffer of 5 minutes
  return accessToken;
}

export async function uploadToOneDrive(filename: string, buffer: Buffer, mimeType: string) {
  const token = await getAccessToken();
  const { userId, folder } = env.oneDrive;
  
  if (!userId) {
    throw new Error("USER_ID (OneDrive owner) not configured");
  }

  // 1. Upload the file
  const uploadUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${folder}/${filename}:/content`;
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
    },
    body: buffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`OneDrive Upload failed: ${uploadData.error?.message || "Unknown error"}`);
  }

  const itemId = uploadData.id;

  // 2. Create a sharing link (view-only)
  const shareUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}/createLink`;
  const shareRes = await fetch(shareUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "view",
      scope: "anonymous", // Anonymous for easy viewing
    }),
  });

  const shareData = await shareRes.json();
  if (!shareRes.ok) {
    // If anonymous is blocked by tenant policy, try 'organization' or just return the item data
    console.warn("Failed to create anonymous sharing link, file might require login:", shareData.error?.message);
    return {
      drive_item_id: itemId,
      url: uploadData.webUrl, // Fallback to private webUrl
      size: uploadData.size,
      mime_type: mimeType,
    };
  }

  return {
    drive_item_id: itemId,
    url: shareData.link.webUrl,
    download_url: shareData.link.webUrl + "&download=1", // Often works for direct download
    size: uploadData.size,
    mime_type: mimeType,
  };
}

export async function getOneDriveContent(driveItemId: string) {
  console.log("[OneDrive] Fetching content for ID:", driveItemId);
  const token = await getAccessToken();
  const { userId } = env.oneDrive;
  
  if (!userId) {
    throw new Error("USER_ID (OneDrive owner) not configured");
  }

  const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${driveItemId}/content`;
  console.log("[OneDrive] Graph URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OneDrive] Fetch failed (${response.status}):`, errorText);
      throw new Error(`Failed to fetch OneDrive content: ${response.statusText}`);
    }

    console.log("[OneDrive] Fetch success. Status:", response.status);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[OneDrive] Buffer received. Size:", buffer.length);

    return {
      buffer,
      mimeType: response.headers.get("content-type") || "application/octet-stream",
    };
  } catch (err: any) {
    console.error("[OneDrive] Request Exception:", err.message);
    throw err;
  }
}
