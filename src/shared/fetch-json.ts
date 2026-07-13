export async function getJson<T>(url: string | URL): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const resp = await fetch(url);

    if (!resp.ok) {
      reject(`Error fetching '${url}': ${resp.status} ${resp.statusText}`);
    }
    else {
      const json = await resp.json();
      resolve(json as T);
    }
  });
};
