import { useSettings, SETTINGS_KEYS } from '@/lib/settings';

// Hook to handle data saver mode
export const useDataSaver = () => {
  const { getSetting } = useSettings();
  const dataSaverMode = getSetting(SETTINGS_KEYS.DATA_SAVER_MODE);

  const getImageProps = (src, alt = '') => {
    if (dataSaverMode) {
      return {
        src: undefined, // Don't load images in data saver mode
        alt,
        style: { 
          backgroundColor: '#f3f4f6', 
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        children: <span className="text-gray-500 text-sm">Image (Data Saver)</span>
      };
    }
    
    return { src, alt };
  };

  const shouldLoadResource = (type = 'image') => {
    if (dataSaverMode) {
      // In data saver mode, only load essential resources
      return type === 'essential';
    }
    return true;
  };

  return {
    dataSaverMode,
    getImageProps,
    shouldLoadResource
  };
};

export default useDataSaver;