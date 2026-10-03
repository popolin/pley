import { Footer } from '../sections/Footer'
import { Hero } from '../sections/Hero'
import { Messages } from '../sections/Messages'
import { PhotoPreview } from '../sections/PhotoPreview'
import { TributeVideo } from '../sections/TributeVideo'

export function Home() {
  return (
    <main>
      <Hero />
      <TributeVideo />
      <PhotoPreview />
      <Messages />
      <Footer />
    </main>
  )
}
