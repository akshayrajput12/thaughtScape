import { cn } from "@/lib/utils";

interface ImageSource {
  src: string;
  alt: string;
}

interface ShowImageListItemProps {
  text: string;
  images: [ImageSource, ImageSource];
}

function RevealImageListItem({ text, images }: ShowImageListItemProps) {
  const container = "absolute right-4 sm:right-8 -top-1 z-40 h-16 sm:h-20 w-12 sm:w-16";
  const effect =
    "relative duration-500 delay-100 shadow-none group-hover:shadow-xl scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 group-hover:w-full group-hover:h-full w-12 sm:w-16 h-12 sm:h-16 overflow-hidden transition-all rounded-md";

  return (
    <div className="group relative h-fit w-fit overflow-visible py-4 sm:py-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground transition-all duration-500 group-hover:opacity-40">
        {text}
      </h1>
      <div className={container}>
        <div className={effect}>
          <img alt={images[1].alt} src={images[1].src} className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
      <div
        className={cn(
          container,
          "translate-x-0 translate-y-0 rotate-0 transition-all delay-150 duration-500 group-hover:translate-x-4 group-hover:translate-y-4 sm:group-hover:translate-x-6 sm:group-hover:translate-y-6 group-hover:rotate-12",
        )}
      >
        <div className={cn(effect, "duration-200")}>
          <img alt={images[0].alt} src={images[0].src} className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
    </div>
  );
}

function RevealImageList() {
  const items: ShowImageListItemProps[] = [
    {
      text: "Express",
      images: [
        {
          src: "https://images.unsplash.com/photo-1474073705359-5da2a8270c64?w=200&auto=format&fit=crop&q=60",
          alt: "Thaught Expression",
        },
        {
          src: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=200&auto=format&fit=crop&q=60",
          alt: "Creative Writing",
        },
      ],
    },
    {
      text: "Create",
      images: [
        {
          src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&auto=format&fit=crop&q=60",
          alt: "Thaughts Creation",
        },
        {
          src: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=200&auto=format&fit=crop&q=60",
          alt: "Writing Thoughts",
        },
      ],
    },
    {
      text: "Connect",
      images: [
        {
          src: "https://images.unsplash.com/photo-1459369510627-9efbee1e6051?w=200&auto=format&fit=crop&q=60",
          alt: "Thaughts Community",
        },
        {
          src: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=200&auto=format&fit=crop&q=60",
          alt: "Thaughts Connection",
        },
      ],
    },
  ];
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-background/50 backdrop-blur-sm px-4 sm:px-8 py-3 sm:py-4">
      <h3 className="text-xs sm:text-sm font-black uppercase text-muted-foreground">Our Community</h3>
      {items.map((item, index) => (
        <RevealImageListItem key={index} text={item.text} images={item.images} />
      ))}
    </div>
  );
}

export { RevealImageList };