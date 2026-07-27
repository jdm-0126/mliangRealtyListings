'use client'

import { Share2, Copy, Calculator, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

interface ActionButtonsProps {
  property: any
  onCopyPost: () => void
  onCopyMortgage: () => void
  onShowFinancing: () => void
  onShowProcess: () => void
}

export function ActionButtons({
  property,
  onCopyPost,
  onCopyMortgage,
  onShowFinancing,
  onShowProcess,
}: ActionButtonsProps) {
  const displayId =
    property.property_id > 2
      ? property.property_id - 1
      : property.property_id

  const shareToFacebook = () => {
    onCopyPost()

    const text = encodeURIComponent(
      `Property #${displayId} - ${property.Village}, ${property.Location}`
    )

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}&quote=${text}`,
      '_blank',
      'width=600,height=400'
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Tooltip content="Share to Facebook">
        <Button
          variant="outline"
          size="sm"
          onClick={shareToFacebook}
          className="w-full"
        >
          <Share2 className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">FB Post</span>
        </Button>
      </Tooltip>

      <Tooltip content="Copy Facebook post">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyPost}
          className="w-full"
        >
          <Copy className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
      </Tooltip>

      <Tooltip content="Mortgage calculator">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowFinancing}
          className="w-full"
        >
          <Calculator className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Finance</span>
        </Button>
      </Tooltip>

      <Tooltip content="Buying process">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowProcess}
          className="w-full"
        >
          <FileText className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Process</span>
        </Button>
      </Tooltip>

      <Tooltip content="Copy mortgage computation">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyMortgage}
          className="w-full col-span-2 sm:col-span-4"
        >
          <Copy className="w-4 h-4 sm:mr-2" />
          <span>Mortgage</span>
        </Button>
      </Tooltip>
    </div>
  )
}