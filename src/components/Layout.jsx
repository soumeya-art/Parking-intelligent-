import Header from './Header'
import BackToTop from './BackToTop'

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <BackToTop />
    </div>
  )
}
