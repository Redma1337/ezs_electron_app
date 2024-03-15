import { useState } from 'react';
import { useFilePicker } from 'use-file-picker';

export const FileHandler = () => {
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(false);

    const { openFilePicker } = useFilePicker({
        accept: '.csv',
        readAs: 'Text',
        multiple: false,
        onFilesSelected: ({ filesContent }) => {
            if (filesContent.length > 0) {
                const content = filesContent[0].content;
                const data = parseCsv(content);
                setParsedData(data);
            }
        },
    });

    const parseCsv = (csvContent: string) => {
        const rows = csvContent.split('\n');
        return rows.map(row => row.split(','));
    };

    return { openFilePicker, parsedData, loading };
};
