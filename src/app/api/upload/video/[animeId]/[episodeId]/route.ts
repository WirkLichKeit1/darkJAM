import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Route Handler — proxy de upload de vídeo
 *
 * Por que isso existe?
 * O upload direto frontend → Cloudinary falha com CORS porque o Cloudinary
 * não expõe uma configuração simples de origem permitida para uploads.
 *
 * Este handler resolve o problema sem passar o binário pelo servidor Render:
 * - Roda no Vercel (Edge/Node.js), não no Render
 * - Lê o JWT do cookie server-side e injeta o Authorization header
 * - Faz proxy do multipart diretamente para o backend — sem bufferizar em memória
 * - O Render recebe apenas a requisição já autenticada vinda do Vercel
 *
 * O frontend aponta o upload para /api/upload/video/[animeId]/[episodeId],
 * e este handler repassa tudo para o backend com o token correto.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ animeId: string; episodeId: string }> }
) {
  const { animeId, episodeId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const backendUrl = `${process.env.API_URL}/api/animes/${animeId}/episodes/${episodeId}/video-signature`;

  // Primeiro passo: pede a assinatura ao backend
  let sigResponse: Response;
  try {
    sigResponse = await fetch(backendUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Backend unreachable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!sigResponse.ok) {
    const body = await sigResponse.text();
    return new Response(body, {
      status: sigResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sig = await sigResponse.json();

  // Segundo passo: faz upload direto para o Cloudinary a partir do Vercel
  // O browser envia o multipart para cá, e repassamos para o Cloudinary.
  // O Render nunca vê o arquivo — o upload acontece Vercel → Cloudinary.
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({ message: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Monta o FormData para enviar ao Cloudinary com a assinatura
  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("public_id", sig.publicId);
  cloudinaryForm.append("timestamp", String(sig.timestamp));
  cloudinaryForm.append("api_key", sig.apiKey);
  cloudinaryForm.append("signature", sig.signature);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`;

  let cloudinaryResponse: Response;
  try {
    cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryForm,
    });
  } catch {
    return new Response(JSON.stringify({ message: "Failed to reach Cloudinary" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!cloudinaryResponse.ok) {
    const errorBody = await cloudinaryResponse.text();
    return new Response(errorBody, {
      status: cloudinaryResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cloudinaryData = await cloudinaryResponse.json();
  const publicId: string = cloudinaryData.public_id;

  // Terceiro passo: confirma o upload com o backend
  const confirmUrl = `${process.env.API_URL}/api/animes/${animeId}/episodes/${episodeId}/video-confirm`;

  let confirmResponse: Response;
  try {
    confirmResponse = await fetch(confirmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });
  } catch {
    return new Response(JSON.stringify({ message: "Failed to confirm upload with backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!confirmResponse.ok) {
    const body = await confirmResponse.text();
    return new Response(body, {
      status: confirmResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ publicId, status: "ready" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}