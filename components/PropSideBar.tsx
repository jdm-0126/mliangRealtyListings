import { useState } from "react";
import {
  Share2,
  Copy,
  MapPin,
  DollarSign,
  Calculator,
  Maximize2,
} from "lucide-react";
import { Property } from "@/lib/shared/types/public"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { formatPHP } from "@/lib/shared/financing/calculateFinancing";



interface PropSideBarProps {
    propertys: Property;
    formatPrice: string;
    onShowFinancing: () => void;
    onFullscreen: () => void;
}


export function PropSideBar({
  propertys,
  formatPrice,
  onShowFinancing,
  onFullscreen,
}: PropSideBarProps) {
  const [showFinancing, setShowFinancing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const property = {
    Title: "Modern Apartment in City Center",
    Location: "Manila",
    Village: "Makati",
    Listing_Price: 5000000,
    Negotiable: "Yes",
  };

  const locationText = [property.Village, property.Location]
    .filter(Boolean)
    .join(", ");

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property.Title,
        text: `Check out this property: ${property.Title}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Property Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{property.Title}</h3>

              <p className="mt-1 flex items-center text-sm text-gray-600">
                <MapPin className="mr-1 h-4 w-4" />
                {locationText}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
            >
              <Copy className="mr-1 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <DollarSign className="mx-auto mb-2 h-8 w-8 text-green-600" />

            <p className="mb-1 text-sm text-gray-600">
              Listing Price
            </p>

            <p className="text-2xl font-bold text-green-600">
              {formatPHP(property.Listing_Price)}
            </p>

            {property.Negotiable === "Yes" && (
              <Badge
                variant="outline"
                className="mt-2"
              >
                Negotiable
              </Badge>
            )}

            <Button
              className="mt-4 w-full"
              onClick={() => setShowFinancing(true)}
            >
              <Calculator className="mr-2 h-4 w-4" />
              View Financing Options
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}