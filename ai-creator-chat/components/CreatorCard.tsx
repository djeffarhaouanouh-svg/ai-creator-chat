import Link from 'next/link';
import Image from 'next/image';
import { Creator } from '@/data/creators';
import { MessageCircle, Users } from 'lucide-react';

interface CreatorCardProps {
  creator: Creator;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link href={`/creator/${creator.username}`}>
      <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={creator.coverImage}
            alt={creator.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Avatar overlapping */}
           <div className="absolute -bottom-12 left-6">
             <div className="relative w-24 h-24 rounded-full border-4 border-black overflow-hidden">

              <Image
                src={creator.avatar}
                alt={creator.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 px-6 pb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{creator.name}</h3>
          <p className="text-sm text-gray-500 mb-3">@{creator.username}</p>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{creator.bio}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {creator.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-primary-50 text-primary-600 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{creator.subscribers.toLocaleString()} abonnés</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              <span>{(creator.messagesCount / 1000).toFixed(0)}k messages</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">{creator.price}€</span>
              <span className="text-gray-500 text-sm">/mois</span>
            </div>
            <div className="px-4 py-2 bg-primary-600 text-white rounded-lg group-hover:bg-primary-700 transition-colors">
              Discuter
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
