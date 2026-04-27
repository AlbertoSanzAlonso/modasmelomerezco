
import { INSFORGE_URL, INSFORGE_API_KEY, headers } from './client';

const BUCKET = 'products';

export const storage = {
  /**
   * Uploads a file to the Insforge 'products' bucket using the presigned S3 flow:
   * 1. Get upload strategy → presigned POST URL + fields
   * 2. POST file to S3
   * 3. Confirm upload with Insforge
   * Returns the public URL of the uploaded object.
   */
  upload: async (file: File): Promise<string> => {
    // --- Step 1: Get upload strategy ---
    const strategyRes = await fetch(
      `${INSFORGE_URL}/api/storage/buckets/${BUCKET}/upload-strategy`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      }
    );

    if (!strategyRes.ok) {
      const err = await strategyRes.json().catch(() => ({}));
      throw new Error(err.message || `Upload strategy failed: ${strategyRes.status}`);
    }

    const strategy = await strategyRes.json();
    const { method, uploadUrl, fields, key, confirmRequired, confirmUrl } = strategy;

    // --- Step 2: Upload file ---
    if (method === 'presigned') {
      // S3 presigned POST — include all fields + file
      const s3Form = new FormData();
      if (fields) {
        Object.entries(fields).forEach(([k, v]) => s3Form.append(k, v as string));
      }
      s3Form.append('file', file);

      const s3Res = await fetch(uploadUrl, { method: 'POST', body: s3Form });
      if (!s3Res.ok && s3Res.status !== 204) {
        throw new Error(`S3 upload failed: ${s3Res.status}`);
      }

      // --- Step 3: Confirm upload (S3 only) ---
      if (confirmRequired && confirmUrl) {
        const confirmRes = await fetch(`${INSFORGE_URL}${confirmUrl}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: file.size, contentType: file.type }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json().catch(() => ({}));
          throw new Error(err.message || `Confirm upload failed: ${confirmRes.status}`);
        }

        const confirmed = await confirmRes.json();
        // confirmed.url is a relative path, build the full public URL
        const objectUrl = confirmed.url?.startsWith('http')
          ? confirmed.url
          : `${INSFORGE_URL}${confirmed.url}`;
        return objectUrl;
      }
    } else {
      // Local storage: direct PUT
      const putForm = new FormData();
      putForm.append('file', file);
      const putRes = await fetch(uploadUrl.startsWith('http') ? uploadUrl : `${INSFORGE_URL}${uploadUrl}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${INSFORGE_API_KEY}` },
        body: putForm,
      });
      if (!putRes.ok) throw new Error(`Direct upload failed: ${putRes.status}`);
      const data = await putRes.json();
      return data.url?.startsWith('http') ? data.url : `${INSFORGE_URL}${data.url}`;
    }

    // Fallback: build public URL from key
    return `${INSFORGE_URL}/api/storage/buckets/${BUCKET}/objects/${key}`;
  },

  /**
   * Deletes a file from the products bucket.
   * Accepts either a full URL or just the object key.
   */
  delete: async (urlOrKey: string): Promise<void> => {
    // Only delete if it's an Insforge URL
    if (urlOrKey.startsWith('/') || !urlOrKey.includes(INSFORGE_URL)) {
      return;
    }

    // Extract the key — the part after /objects/
    let key = urlOrKey;
    const match = urlOrKey.match(/\/objects\/(.+)$/);
    if (match) {
      key = match[1];
    } else if (urlOrKey.startsWith('http')) {
      // Last path segment fallback
      key = urlOrKey.split('/').pop() || urlOrKey;
    }

    await fetch(`${INSFORGE_URL}/api/storage/buckets/${BUCKET}/objects/${key}`, {
      method: 'DELETE',
      headers,
    });
  },
};
