import PropertyDetails from "@/app/properties/[id]/PropertyDetails";


interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  return <PropertyDetails property={id} />
}