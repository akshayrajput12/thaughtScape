import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  companyName?: string;
  salary?: string;
  isJob?: boolean;
}

export const SEO = ({
  title = 'CampusCash - Learn, Earn, and Connect on Campus',
  description = 'CampusCash is the ultimate platform for college students to find jobs, freelance opportunities, share thoughts, and connect with peers on campus.',
  keywords = 'campus jobs, college freelancing, student marketplace, campus networking, student gigs, college jobs, campus cash, student opportunities',
  ogImage = '/logo.png',
  ogType = 'website',
  ogUrl,
  companyName,
  salary,
  isJob = false,
}: SEOProps) => {
  const fullTitle = title.includes('CampusCash') ? title : `${title} | CampusCash`;

  // Create a more attractive description for job posts
  const enhancedDescription = isJob && companyName && salary
    ? `${companyName} is hiring for ${title}. Salary: ${salary}. ${description}`
    : description;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', enhancedDescription);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);

    // Update Open Graph meta tags
    const metaTags = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: enhancedDescription },
      { property: 'og:image', content: ogImage },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: ogUrl || window.location.href },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: fullTitle },
      { property: 'twitter:description', content: enhancedDescription },
      { property: 'twitter:image', content: ogImage },
    ];

    metaTags.forEach(({ property, content }) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });

    // Clean up function
    return () => {
      document.title = 'CampusCash';
    };
  }, [fullTitle, enhancedDescription, keywords, ogImage, ogType, ogUrl]);

  // This component doesn't render anything
  return null;
};

export default SEO;
