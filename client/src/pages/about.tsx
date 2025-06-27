import { Link } from 'wouter';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Radio
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-green-400 flex items-center justify-center text-lg font-bold font-mono">
              U
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono">About Unheard Radio</h1>
          </div>
        </div>

        {/* Mission Section */}
        <Card className="bg-gray-900 border-green-400/20 mb-8">
          <CardContent className="p-6">
            <div className="space-y-6 text-green-300">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400 mb-6">
                  Unheardradio.io is your portal to the strange side of sound.
                </p>
              </div>
              
              <div className="space-y-4 text-lg leading-relaxed">
                <p>
                  No algorithms. No charts. Just a handpicked mess of the world's most obscure radio — 
                  glitchy transmissions, ghost signals, and offbeat gems.
                </p>
                <p>
                  We spotlight the weird. We elevate the overlooked.
                </p>
                <p className="text-cyan-400 font-semibold">
                  Anti-algorithm radio. Always live. Never normal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card className="bg-gray-900 border-green-400/20 mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-4 text-green-300">
              <div>
                <h3 className="font-semibold mb-2">🌍 Global Discovery</h3>
                <p className="text-sm">Explore radio stations from every corner of the world, sorted by obscurity level.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📍 Geographic Mapping</h3>
                <p className="text-sm">Interactive world map showing exact station locations and broadcasting details.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔍 Advanced Filtering</h3>
                <p className="text-sm">Search by country, genre, language, and listener count to find your perfect obscure station.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">💾 Personal Collection</h3>
                <p className="text-sm">Bookmark your favorite discoveries and build your own curated collection of rare stations.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-green-400/20">
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy">
              <button className="text-green-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </button>
            </Link>
            <a 
              href="mailto:hello@z13labs.com" 
              className="text-green-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              Contact Us
            </a>
          </div>
          <div className="text-sm text-green-400/70">
            Made by <span className="text-cyan-400 font-semibold">Z13labs</span>
          </div>
        </div>
      </div>
    </div>
  );
}