import express from 'express'
import { prisma } from '../db/index.js'
import { GoogleGenAI } from '@google/genai'
const castRouter = express.Router()


// This api will return the cast info and the script the full script !
castRouter.post('/cast', async (req, res) => {
const {storyboardId} = req.body

if(!storyboardId){
  res.status(400).json({error: 'Storyboard ID is required'})
  return
}
const storyboard=await prisma.storyboard.findUnique({
  where: {  
    id: storyboardId,
  },
  select: {
    script: true,
  },
})
if(!storyboard){
  res.status(400).json({error: 'Storyboard not found'})
  return
}

const cast=await prisma.castMember.findMany({
  where: {
    storyboardId: storyboardId,
  },
})
const llm = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '' })

// Generate one image per cast member using Imagen
const imageResults = await Promise.all(
  cast.map(async (member) => {
    const prompt = `A cinematic character portrait of "${member.name}": ${member.description || 'a character'}. Context from the screenplay:\n${storyboard.script?.slice(0, 500) ?? ''}`

    const response = await llm.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt,
      config: { numberOfImages: 1 },
    })

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
    const base64Image = imageBytes
      ? `data:image/png;base64,${imageBytes}`
      : ''

    return {
      id: String(member.id),
      name: member.name,
      description: member.description ?? '',
      color: member.color ?? '',
      image: base64Image,
    }
  })
)

res.json({ cast: imageResults, script: storyboard.script, storyboardId })
})
export default castRouter