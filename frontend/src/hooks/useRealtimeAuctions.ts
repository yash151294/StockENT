import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';

export const useRealtimeAuctions = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Optimistically update auction data in cache instead of invalidating
  const updateAuctionInCache = useCallback((updatedAuction: any) => {
    console.log('🔄 Updating auction in cache:', updatedAuction);
    
    // Get all auction queries from cache
    const auctionQueries = queryClient.getQueryCache().getAll().filter(q => 
      Array.isArray(q.queryKey) && q.queryKey[0] === 'auctions'
    );
    
    auctionQueries.forEach(query => {
      const queryKey = query.queryKey;
      const currentData = queryClient.getQueryData(queryKey) as any;
      
      if (currentData && currentData.auctions && Array.isArray(currentData.auctions)) {
        const updatedAuctions = currentData.auctions.map((auction: any) => {
          if (auction.id === updatedAuction.auctionId) {
            return {
              ...auction,
              status: updatedAuction.status,
              startTime: updatedAuction.startTime || auction.startTime,
              endTime: updatedAuction.endTime || auction.endTime,
              // Update other fields as needed
            };
          }
          return auction;
        });
        
        // Update the cache with new data
        queryClient.setQueryData(queryKey, {
          ...currentData,
          auctions: updatedAuctions
        });
        
        console.log('✅ Updated auction in cache for query:', queryKey);
      }
    });
  }, [queryClient]);

  const invalidateAllAuctions = useCallback(() => {
    console.log('🔄 Invalidating all auction queries...');
    console.log('🔄 Current queries in cache:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
    queryClient.invalidateQueries({ 
      queryKey: ['auctions'],
      exact: false 
    });
    console.log('🔄 Auction queries invalidated successfully');
  }, [queryClient]);

  // New function to update auction data in real-time without full invalidation
  const updateAuctionData = useCallback((updatedAuction: any) => {
    console.log('🔄 Updating auction data in real-time:', updatedAuction);
    
    // Get all auction queries from cache
    const auctionQueries = queryClient.getQueryCache().getAll().filter(q => 
      Array.isArray(q.queryKey) && q.queryKey[0] === 'auctions'
    );
    
    auctionQueries.forEach(query => {
      const queryKey = query.queryKey;
      const currentData = queryClient.getQueryData(queryKey) as any;
      
      if (currentData && currentData.auctions && Array.isArray(currentData.auctions)) {
        const updatedAuctions = currentData.auctions.map((auction: any) => {
          if (auction.id === updatedAuction.auctionId) {
            return {
              ...auction,
              status: updatedAuction.status,
              startTime: updatedAuction.startTime || auction.startTime,
              endTime: updatedAuction.endTime || auction.endTime,
              currentBid: updatedAuction.currentBid || auction.currentBid,
              bidCount: updatedAuction.bidCount || auction.bidCount,
            };
          }
          return auction;
        });
        
        // Update the cache with new data
        queryClient.setQueryData(queryKey, {
          ...currentData,
          auctions: updatedAuctions
        });
        
        console.log('✅ Updated auction in cache:', updatedAuction.auctionId);
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 Socket not connected for real-time auctions:', { 
        socket: !!socket, 
        isConnected,
        socketId: socket?.id 
      });
      return;
    }

    console.log('🔌 Setting up real-time auction listeners...', {
      socketId: socket.id,
      isConnected,
      socketConnected: socket.connected
    });

    // Add a general event listener to catch all events for debugging
    const handleAllEvents = (eventName: string, data: any) => {
      console.log(`🔍 Socket event received: ${eventName}`, data);
    };

    // Listen for all events (for debugging)
    socket.onAny(handleAllEvents);

    const handleAuctionStatusChanged = (data: any) => {
      console.log('🔄 Auction status changed event received:', data);
      console.log('🔄 Event details:', {
        auctionId: data.auctionId,
        status: data.status,
        type: data.type,
        productTitle: data.product?.title
      });
      
      // Show user-friendly notifications
      if (data.type === 'STARTED') {
        console.log(`🎉 Auction "${data.product?.title}" has started!`);
      } else if (data.type === 'ENDED') {
        console.log(`🏁 Auction "${data.product?.title}" has ended!`);
      }

      // Update cache with real-time data
      console.log('🔄 Updating auction in cache...');
      updateAuctionData(data);
    };

    const handleAuctionBatchProcessed = (data: any) => {
      console.log('📦 Auction batch processed:', data);
      // For batch processing, we still need to invalidate to get fresh data
      invalidateAllAuctions();
    };

    const handleAuctionStarted = (data: any) => {
      console.log('🚀 Auction started:', data);
      // Update cache with started auction data
      updateAuctionData({
        auctionId: data.auctionId,
        status: 'ACTIVE',
        startTime: data.startTime,
        type: 'STARTED'
      });
    };

    const handleAuctionEnded = (data: any) => {
      console.log('🏁 Auction ended:', data);
      // Update cache with ended auction data
      updateAuctionData({
        auctionId: data.auctionId,
        status: 'ENDED',
        endTime: data.endTime,
        type: 'ENDED'
      });
    };

    const handleAuctionRestarted = (data: any) => {
      console.log('🔄 Auction restarted:', data);
      // Update cache with restarted auction data
      updateAuctionData({
        auctionId: data.auctionId,
        status: 'ACTIVE',
        startTime: data.startTime,
        endTime: data.endTime,
        type: 'RESTARTED'
      });
    };

    // Listen for real-time auction events
    socket.on('auction_status_changed', handleAuctionStatusChanged);
    socket.on('auction_batch_processed', handleAuctionBatchProcessed);
    socket.on('auction_started', handleAuctionStarted);
    socket.on('auction_ended', handleAuctionEnded);
    socket.on('auction_restarted', handleAuctionRestarted);

    // Cleanup listeners
    return () => {
      console.log('🧹 Cleaning up real-time auction listeners...');
      socket.off('auction_status_changed', handleAuctionStatusChanged);
      socket.off('auction_batch_processed', handleAuctionBatchProcessed);
      socket.off('auction_started', handleAuctionStarted);
      socket.off('auction_ended', handleAuctionEnded);
      socket.off('auction_restarted', handleAuctionRestarted);
      socket.offAny(handleAllEvents);
    };
  }, [socket, isConnected, updateAuctionInCache, invalidateAllAuctions, updateAuctionData]);

  return {
    isConnected,
    invalidateAllAuctions,
    updateAuctionInCache,
    updateAuctionData
  };
};
