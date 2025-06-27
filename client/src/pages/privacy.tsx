import { Link } from 'wouter';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/about">
            <Button variant="outline" size="sm" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to About
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-green-400 flex items-center justify-center text-lg font-bold font-mono">
              U
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono">Privacy Policy</h1>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <Card className="bg-gray-900 border-green-400/20 mb-8">
          <CardContent className="p-6 space-y-6">
            <div className="text-sm text-green-400/70 mb-4">
              Last updated: June 27, 2025
            </div>

            <div className="space-y-4 text-green-300">
              <p>
                At <strong className="text-cyan-400">unheardradio.io</strong>, we take your privacy seriously. This Privacy Policy outlines the types of information we may collect, how we use it, and the choices you have regarding your data.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">1. Information We Collect</h2>
              <div className="space-y-3 text-green-300">
                <p>We may collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Usage Data:</strong> When you visit our site, we may automatically collect information such as your IP address, browser type, device, pages visited, and the time spent on the site.</li>
                  <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your browsing experience and to show relevant content and ads.</li>
                  <li><strong>Analytics:</strong> We may use services like Google Analytics to understand how users engage with our website.</li>
                  <li><strong>Advertising:</strong> Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to unheardradio.io and/or other sites on the internet.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">2. How We Use Your Information</h2>
              <div className="space-y-3 text-green-300">
                <p>We use collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Improve the performance and content of unheardradio.io</li>
                  <li>Provide relevant advertising through services like Google AdSense</li>
                  <li>Monitor usage patterns to better understand our visitors</li>
                </ul>
                <p>We do <strong className="text-cyan-400">not</strong> sell, rent, or trade your personal information.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">3. Your Privacy Choices</h2>
              <div className="space-y-3 text-green-300">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Opt out of personalized ads:</strong> Visit <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-cyan-400 underline">www.aboutads.info</a> to manage your preferences.</li>
                  <li><strong>Manage cookies:</strong> Most browsers allow you to control cookies through their settings.</li>
                </ul>
                <p>
                  To learn more about how Google uses your data, visit: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-cyan-400 underline">How Google uses information from sites or apps that use our services</a>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">4. External Links</h2>
              <div className="space-y-3 text-green-300">
                <p>Our website may include links to third-party radio stations or services. We are not responsible for the privacy practices or content of these external sites.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">5. Changes to This Policy</h2>
              <div className="space-y-3 text-green-300">
                <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date at the top.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">6. Contact Us</h2>
              <div className="space-y-3 text-green-300">
                <p>If you have any questions about this Privacy Policy, feel free to contact us at:</p>
                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:hello@unheardradio.io" className="text-green-400 hover:text-cyan-400 underline">hello@unheardradio.io</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href="https://unheardradio.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-cyan-400 underline">https://unheardradio.io</a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}