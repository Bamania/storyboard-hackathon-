import { add } from "three/tsl";
import { create } from "zustand";


interface queueStore {
    queueItems:QueueItem[];
    isProcessing: boolean;
    addToQueue:(item:QueueItem)=>void;
    popQueue:()=>void;
    setIsProcessing:(processing:boolean)=>void;
}
interface QueueItem {
    scene: number;
    storyboardId: number;
    directorParams: object;
    cinematographerParams: object;
    productionDesignerParams: object;
    editorParams: object;
}
const queueStore = create<queueStore>((set ,get) => ({
// make vars and the fx to update them here

queueItems: [], //we will push the finished params of each scene
isProcessing: false, // Track if queue processing is in-flight
// {
//     "scene":01,
//     "directorParams":{},
//     "cinematographerParams":{},
//     "productionDesignerParams":{},
//     "editorParams":{}
// }

addToQueue:(item:QueueItem)=>{
    set((state)=>({
        queueItems:[...state.queueItems,item]
    }))
},
popQueue:()=>{
    // basically remove the First Item 
    set((state)=>({
        queueItems:state.queueItems.slice(1)
    }))
},
setIsProcessing:(processing:boolean)=>{
    set({isProcessing:processing})
}



}));

export const useQueueStore = queueStore;

// const bookStore = (set, get) => ({
//   books: [],
//   noOfAvailable: 0,
//   noOfIssued: 0,


//   addBook: (book) => {

    
//     set((state) => ({
//       books: [...state.books, { ...book, status: "available" }],
//       noOfAvailable: state.noOfAvailable + 1,
//     }));
//   },
//   issueBook: (id) => {
//     const books = get().books;
//     const updatedBooks = books?.map((book) => {
//       if (book.id === id) {
//         return {
//           ...book,
//           status: "issued",
//         };
//       } else {
//         return book;
//       }
//     });
//     set((state) => ({
//       books: updatedBooks,
//       noOfAvailable: state.noOfAvailable - 1,
//       noOfIssued: state.noOfIssued + 1,
//     }));
//   },
//   returnBook: (id) => {
//     const books = get().books;
//     const updatedBooks = books?.map((book) => {
//       if (book.id === id) {
//         return {
//           ...book,
//           status: "available",
//         };
//       } else {
//         return book;
//       }
//     });
//     set((state) => ({
//       books: updatedBooks,
//       noOfAvailable: state.noOfAvailable + 1,
//       noOfIssued: state.noOfIssued - 1,
//     }));
//   },
//   reset: () => {
//     set({
//       books: [],
//       noOfAvailable: 0,
//       noOfIssued: 0,
//     });
//   },
// });

// const useBookStore = create(bookStore);

// export default useBookStore;