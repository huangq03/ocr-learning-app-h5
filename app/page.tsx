import LandingPage from "@/components/landing-page"
import { getPageSession } from "@/lib/actions"

export default async function Home() {
  const { session } = await getPageSession()
  return <LandingPage session={session} />
}
