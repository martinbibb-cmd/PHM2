import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Copy, Check, Share2 } from 'lucide-react';

interface ShareVisitDialogProps {
  visitId: number;
}

export function ShareVisitDialog({ visitId }: ShareVisitDialogProps) {
  const [shareData, setShareData] = useState<{ shareId: string; shareUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareMutation = useMutation({
    mutationFn: () => api.generateVisitShare(visitId),
    onSuccess: (response) => {
      setShareData(response.data);
    },
  });

  // Generate QR code when share data is available
  useEffect(() => {
    if (shareData && canvasRef.current) {
      const fullUrl = `${window.location.origin}${shareData.shareUrl}`;
      QRCode.toCanvas(canvasRef.current, fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [shareData]);

  const handleGenerateShare = () => {
    shareMutation.mutate();
  };

  const handleCopyLink = () => {
    if (shareData) {
      const fullUrl = `${window.location.origin}${shareData.shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `visit-${visitId}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Survey with Customer
        </CardTitle>
        <CardDescription>
          Generate a shareable link and QR code for your customer to view their survey results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareData ? (
          <div className="text-center py-4">
            <Button
              onClick={handleGenerateShare}
              disabled={shareMutation.isPending}
              size="lg"
            >
              {shareMutation.isPending ? 'Generating...' : 'Generate Share Link'}
            </Button>
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                <canvas ref={canvasRef} />
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <Label htmlFor="shareLink">Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  id="shareLink"
                  value={`${window.location.origin}${shareData.shareUrl}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600">Link copied to clipboard!</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">How to share:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Copy the link and send it via email or SMS</li>
                <li>Download the QR code and print it on paperwork</li>
                <li>Customer can scan the QR code with their phone camera</li>
                <li>No login required - customers can view their survey instantly</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
