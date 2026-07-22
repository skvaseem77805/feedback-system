'use client';

import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link2, Check, Share2 } from 'lucide-react';

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  type?: 'project' | 'profile';
}

export function ShareBottomSheet({ isOpen, onClose, shareUrl, title, type }: ShareBottomSheetProps) {
  const [copied, setCopied] = React.useState(false);

  // Auto-reset copied state
  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy link.');
    }
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        // Share cancelled or failed, no action needed
        console.log('Share API error:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShare = (platform: string) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    // Auto-detect type if not explicitly provided
    const isProfile = type === 'profile' || shareUrl.includes('/student/');
    const isProject = type === 'project' || shareUrl.includes('/project/') || shareUrl.includes('/projects/');

    switch (platform) {
      case 'whatsapp': {
        const text = isProfile
          ? `👤 Student Profile\n\n${title}\n\n🔗 View Profile:\n${shareUrl}`
          : `📂 Project\n\n${title}\n\n🔗 View Project:\n${shareUrl}`;
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        break;
      }
      case 'telegram': {
        const text = isProfile
          ? `👤 Student Profile\n\n${title}\n\n🔗 View Profile:`
          : `📂 Project\n\n${title}\n\n🔗 View Project:`;
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`;
        break;
      }
      case 'instagram':
        // Instagram doesn't have a direct share URL, copy to clipboard & redirect
        handleCopyLink();
        toast.info('Instagram opened. Paste the link from your clipboard.');
        url = 'https://www.instagram.com';
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'messenger':
        url = `https://www.facebook.com/dialog/send?app_id=291494419162&link=${encodedUrl}&redirect_uri=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'x': {
        const text = isProfile
          ? `👤 Student Profile: ${title}`
          : `📂 Project: ${title}`;
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`;
        break;
      }
      case 'gmail': {
        const subject = isProfile ? `Student Profile: ${title}` : `Project: ${title}`;
        const body = isProfile
          ? `👤 Student Profile\n\n${title}\n\n🔗 View Profile:\n${shareUrl}`
          : `📂 Project\n\n${title}\n\n🔗 View Project:\n${shareUrl}`;
        url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
      }
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };


  const shareApps = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      bgColor: 'bg-[#25D366]',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.381 9.805-9.768.002-2.607-1.012-5.059-2.859-6.908C16.371 2.08 13.924.996 11.2.996 5.8 1.002 1.401 5.385 1.398 10.771c-.001 1.547.411 3.055 1.196 4.394l-.993 3.624 3.746-.982zm11.52-5.834c-.29-.146-1.715-.847-1.98-.943-.264-.096-.457-.144-.649.146-.193.29-.747.943-.915 1.135-.168.193-.336.217-.626.072-2.825-1.413-4.67-2.684-6.529-5.874-.29-.5-.06-.77.17-.998.208-.206.457-.533.687-.8.23-.267.306-.455.457-.757.15-.303.076-.568-.038-.813-.114-.245-.915-2.203-1.254-3.016-.33-.795-.666-.687-.915-.7c-.237-.013-.509-.015-.781-.015-.272 0-.715.102-1.09.513-.374.409-1.428 1.398-1.428 3.407 0 2.01 1.464 3.953 1.668 4.227.204.272 2.88 4.402 6.977 6.177 4.097 1.775 4.097 1.183 4.835 1.115.738-.069 2.378-.973 2.717-1.917.339-.944.339-1.753.238-1.928-.101-.17-.37-.267-.66-.413z" />
        </svg>
      ),
    },
    {
      id: 'telegram',
      label: 'Telegram',
      bgColor: 'bg-[#0088cc]',
      icon: (
        <svg className="w-5 h-5 fill-white pl-0.5" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.6 1.48-1.55 2.72-2.9 2.72-2.92.01-.03-.01-.1-.08-.12-.08-.02-.19.01-.27.03-.12.03-2 1.26-5.63 3.71-.53.37-1 .55-1.43.54-.48-.01-1.4-.27-2.09-.5-.84-.28-1.5-.43-1.45-.9.03-.25.38-.5.99-.78 3.84-1.67 6.4-2.77 7.68-3.3 3.65-1.53 4.4-1.8 4.9-.18.1.34.09.68.08.99z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      label: 'Instagram',
      bgColor: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      icon: (
        <svg className="w-5 h-5 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bgColor: 'bg-[#1877F2]',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'messenger',
      label: 'Messenger',
      bgColor: 'bg-gradient-to-tr from-[#0084FF] via-[#A033FF] to-[#FF5E62]',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M12 2C6.36 2 2 6.13 2 11.5c0 2.9 1.25 5.56 3.32 7.42V22l2.96-1.63c1.17.33 2.42.5 3.72.5 5.64 0 10-4.13 10-9.5S17.64 2 12 2zm1.2 12.16l-2.44-2.6-4.78 2.6 5.26-5.58 2.5 2.6 4.72-2.6-5.26 5.58z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      bgColor: 'bg-[#0A66C2]',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      id: 'x',
      label: 'X',
      bgColor: 'bg-zinc-950 dark:bg-zinc-800',
      icon: (
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'gmail',
      label: 'Gmail',
      bgColor: 'bg-[#EA4335]',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Back drop blur custom overlay */}
      <DrawerContent className="p-5 pb-8 rounded-t-[24px] bg-white dark:bg-zinc-950 border-t border-border/40 max-w-lg mx-auto fixed bottom-0 inset-x-0 z-50">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-sm font-extrabold tracking-wide uppercase text-muted-foreground/80 flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Share
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
            Share this link via your favorite apps
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Container with horizontal swipe */}
        <div className="my-2 border-t border-b border-border/20 py-2">
          <div className="flex overflow-x-auto gap-4 py-4 px-2 scrollbar-none snap-x snap-mandatory">
            {shareApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleShare(app.id)}
                className="flex flex-col items-center gap-2 min-w-[70px] snap-center select-none active:scale-95 transition-transform duration-100 outline-none border-none bg-transparent cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform ${app.bgColor}`}
                >
                  {app.icon}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center">
                  {app.label}
                </span>
              </button>
            ))}

            {/* Copy Link Button in list */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 min-w-[70px] snap-center select-none active:scale-95 transition-transform duration-100 outline-none border-none bg-transparent cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/40 shadow-sm group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {copied ? 'Copied' : 'Copy Link'}
              </span>
            </button>

            {/* Native More Share Button in list */}
            <button
              onClick={handleMore}
              className="flex flex-col items-center gap-2 min-w-[70px] snap-center select-none active:scale-95 transition-transform duration-100 outline-none border-none bg-transparent cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border/40 shadow-sm group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                More
              </span>
            </button>
          </div>
        </div>

        {/* Copy Link Input box */}
        <div className="flex gap-2 items-center bg-muted/40 p-2.5 rounded-xl border border-border/45 mt-2">
          <Input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none font-mono text-[11px] p-0 h-auto truncate text-muted-foreground selection:bg-primary/20"
          />
          <Button
            size="sm"
            onClick={handleCopyLink}
            className="h-8 rounded-lg font-bold text-xs px-3 shadow-none shrink-0"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
