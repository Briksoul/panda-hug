export default function handler(_request, response) {
  return response.status(200).json({ status: 'ok' })
}
