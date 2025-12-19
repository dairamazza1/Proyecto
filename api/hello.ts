import type { VercelRequest, VercelResponse } from '@vercel/node'
import cors from 'cors'

const corsMiddleware = cors({ origin: '*' })

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  corsMiddleware(req as any, res as any, () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { name } = req.body

    return res.status(200).json({
      message: `Hola ${name} desde Vercel 🚀`
    })
  })
}
