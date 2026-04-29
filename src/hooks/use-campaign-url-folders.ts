/**
 * Re-exports from use-offer-folders for backward compatibility.
 * Campaign URL folders are now unified with Creative Library folders (cl_folders).
 */
export {
  useOfferFolders as useCampaignUrlFolders,
  useOfferFolderItems as useCampaignUrlFolderItems,
  useCreateAndLinkFolder as useCreateCampaignUrlFolder,
  useUpdateOfferFolder as useUpdateCampaignUrlFolder,
  useUnlinkFolderFromOffer as useDeleteCampaignUrlFolder,
  useLinkFolderToOffer,
  useAddFolderItems as useAddCampaignUrlFolderItems,
  useAddFolderItemsSkipDuplicates as useAddCampaignUrlFolderItemsSkipDuplicates,
  useRemoveFolderItem as useRemoveCampaignUrlFolderItem,
  type OfferFolder as CampaignUrlFolder,
  type OfferFolderItem as CampaignUrlFolderItem,
} from "@/hooks/use-offer-folders";
