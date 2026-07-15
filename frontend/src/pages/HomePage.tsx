import SiteLayout from '../components/landing/SiteLayout'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'

export default function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />
      <FeaturesSection />
    </SiteLayout>
  )
}
