import HomeNav from '../components/landing/HomeNav'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HomeFooter from '../components/landing/HomeFooter'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#171311', color: '#f0e9e3' }}>
      <HomeNav />
      <HeroSection />
      <FeaturesSection />
      <HomeFooter />
    </div>
  )
}
