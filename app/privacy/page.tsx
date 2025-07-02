import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-vdu-green font-mono p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-vdu-green hover:text-vdu-green-dim transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Radio
        </Link>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4 glow">Privacy Policy</h1>
            <p className="text-vdu-green-dim">
              Last updated: June 27, 2025
            </p>
          </div>
          
          <div className="space-y-8">
            <p className="leading-relaxed">
              At <strong>unheardradio.io</strong>, we take your privacy seriously. This Privacy Policy outlines the types of information we may collect, how we use it, and the choices you have regarding your data.
            </p>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">1. Information We Collect</h2>
              <div className="space-y-4">
                <p>We may collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 text-vdu-green-dim">
                  <li><strong>Usage Data</strong>: When you visit our site, we may automatically collect information such as your IP address, browser type, device, pages visited, and the time spent on the site.</li>
                  <li><strong>Cookies</strong>: We use cookies and similar tracking technologies to enhance your browsing experience and to show relevant content and ads.</li>
                  <li><strong>Analytics</strong>: We may use services like Google Analytics to understand how users engage with our website.</li>
                  <li><strong>Advertising</strong>: Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to unheardradio.io and/or other sites on the internet.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">2. How We Use Your Information</h2>
              <div className="space-y-4">
                <p>We use collected information to:</p>
                <ul className="list-disc list-inside space-y-2 text-vdu-green-dim">
                  <li>Improve the performance and content of unheardradio.io</li>
                  <li>Provide relevant advertising through services like Google AdSense</li>
                  <li>Monitor usage patterns to better understand our visitors</li>
                </ul>
                <p className="font-semibold">
                  We do <strong>not</strong> sell, rent, or trade your personal information.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">3. Your Privacy Choices</h2>
              <div className="space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-vdu-green-dim">
                  <li><strong>Opt out of personalized ads</strong>: Visit <a href="https://www.aboutads.info" className="text-vdu-green hover:text-vdu-green-dim underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> to manage your preferences.</li>
                  <li><strong>Manage cookies</strong>: Most browsers allow you to control cookies through their settings.</li>
                </ul>
                <p>
                  To learn more about how Google uses your data, visit: <a href="https://policies.google.com/technologies/partner-sites" className="text-vdu-green hover:text-vdu-green-dim underline" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use our services</a>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">4. External Links</h2>
              <p>
                Our website may include links to third-party radio stations or services. We are not responsible for the privacy practices or content of these external sites.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">5. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date at the top.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-vdu-green">6. Contact Us</h2>
              <div className="space-y-2">
                <p>If you have any questions about this Privacy Policy, feel free to contact us at:</p>
                <div className="text-vdu-green-dim">
                  <p><strong>hello@z13labs.com</strong></p>
                  <p><a href="https://unheardradio.io" className="text-vdu-green hover:text-vdu-green-dim underline">https://unheardradio.io</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}