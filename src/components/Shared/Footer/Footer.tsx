import Image from "next/image";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <span className="app-footer-powered">Powered by</span>
          <Image
            src="/footer_logo.svg"
            alt="Resource footer logo"
            width={116}
            height={32}
            className="app-footer-logo"
          />
        </div>

        <div className="app-footer-help">
          <span className="app-footer-help-title">Helpline</span>
          <div className="app-footer-help-item">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>+88 011020202505</span>
          </div>
          <div className="app-footer-help-item">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>support@akij.work</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
