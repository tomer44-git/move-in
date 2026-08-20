import { resolveAuthority } from '../lib/boundary'

/**
 * GET /.netlify/functions/authority?lat=&lon=
 *
 * A thin wrapper over the boundary lookup, so a coordinate can be resolved and
 * tested before there is any geocoder or any address form.
 *
 * It writes nothing and reads nothing from the database. Step 8 puts a geocoder
 * in front of it and the caller's identity behind it; until then there is
 * nothing here to protect but a proxy to a public service.
 */
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  const lat = Number(url.searchParams.get('lat'))
  const lon = Number(url.searchParams.get('lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return json({ outcome: 'bad_request', reason: 'lat and lon must both be numbers' }, 400)
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json({ outcome: 'bad_request', reason: 'lat and lon are out of range' }, 400)
  }

  const result = await resolveAuthority(lat, lon)

  // A failure of someone else's service is not a failure of this request, so it
  // comes back as 200 with an outcome the caller can show. 502 would tell the
  // browser to retry something that will not get better by retrying.
  return json(result, 200)
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
