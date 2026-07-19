// components/Footer.jsx — App footer with branding and disclaimer

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">OsteoAI</div>
        <div className="footer-text">
          Dual-Branch Architecture:{' '}
          <span className="footer-highlight">MobileNetV4</span> +{' '}
          <span className="footer-highlight">ViT</span> | For research purposes only
        </div>
      </div>
    </footer>
  )
}
