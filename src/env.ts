import 'dotenv/config'
import { cleanEnv, str } from 'envalid'

export const env = cleanEnv(process.env, {
  DEPLOY_PASSWORD: str(),
})
