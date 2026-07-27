"use client";

import { useState } from "react";
import { uploadPropertyImage } from "@/lib/cloudinary/uploadManyToCloudinary";
import { PropertyHeader } from "@/components/PropertyHeader";
import { PropertyImage } from "@/components/PropertyImage";
import { PropertyInfo } from "@/components/PropertyInfo";
import { PropSideBar } from "@/components/PropSidebar";
import { ActionButtons } from "@/components/ButtonActions";
import { FacebookPreview } from "@/components/FacebookPreview";
import { FinancingModal } from "@/components/FinancingModal";
import { BuyingProcessModal } from "@/components/BuyingProcessModal";
import UploadPhotoModal from "@/components/UploadPhotoModal";
import { FullscreenImage } from "@/components/FullscreenImage";

import { useProperty } from "./hooks/useProperty";
import { useTenantSettings } from "./hooks/useTenantSettings";
import { useFinancing } from "./hooks/useFinancing";
import { useFacebookPost } from "./hooks/useFacebookPost";

interface PropertyDetailsProps {
  property: any
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  // Modal & UI State
  const [showFinancing, setShowFinancing] = useState(false);
  const [showProcesses, setShowProcesses] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [propertyLoading, usePropertyLoading] = useState(false);
  const customPrice = undefined;

  // 1. Fetch Property & Tenant Data
  const { tenantSettings, loading: tenantLoading } = useTenantSettings();

  // 2. Custom Hooks initialized with property data
  const { fbPostPreview, copyToClipboard } = useFacebookPost({
    property,
    tenantSettings,
    hasPhotos: (property?.Photos?.length ?? 0) > 0,
    hasVideo: !!property?.Video_URL,
  });

  const {
    financing,
    pagibig,
    interestRate,
    setInterestRate,
    pagibigRate,
    setPagibigRate,
    financingMode,
    setFinancingMode,
    copyMortgageComputation,
    formatPrice,
  } = useFinancing({
    property,
    tenantSettings,
    customPrice,
  });

  // Early returns for loading & error states AFTER hooks are called
  if (propertyLoading || tenantLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading property details...
      </div>
    );
  }

  if (!property ) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Property not found.
      </div>
    );
  }

  return (
    <>
      <PropertyHeader property={property} 
      tenantSettings={tenantSettings}/>

      <ActionButtons
        property={property}
        onCopyPost={copyToClipboard}
        onCopyMortgage={copyMortgageComputation}
        onShowFinancing={() => setShowFinancing(true)}
        onShowProcess={() => setShowProcesses(true)}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PropertyImage
            property={property}
            onFullscreen={() => setIsFullscreen(true)}
          />

          <PropertyInfo property={property} />

          <FacebookPreview text={fbPostPreview} />
        </div>

        <PropSideBar
          propertys={property}
          formatPrice={formatPrice}
          onShowFinancing={() => setShowFinancing(true)}
          onFullscreen={() => setIsFullscreen(true)}
        />
      </div>

      <FinancingModal
        open={showFinancing}
        onClose={() => setShowFinancing(false)}
        financing={financing!}
        rawMortgage={property?.Raw_Mortgage_Price!}
        pagibig={pagibig!}
        interestRate={interestRate}
        setInterestRate={setInterestRate}
        pagibigRate={pagibigRate}
        setPagibigRate={setPagibigRate}
        financingMode={financingMode}
        setFinancingMode={setFinancingMode}
      />

      <BuyingProcessModal
        open={showProcesses}
        onClose={() => setShowProcesses(false)}
      />

      <UploadPhotoModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        property={property}
        onUpload={async (file) => {
          await uploadPropertyImage(file, property.property_id);
        }}
      />

      <FullscreenImage
        open={isFullscreen}
        imageUrl={property.Preview_Photo}
        alt={`Property #${
          property.property_id > 2
            ? property.property_id - 1
            : property.property_id
        }`}
        onClose={() => setIsFullscreen(false)}
      />
    </>
  );
}
