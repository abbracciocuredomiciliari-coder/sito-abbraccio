// Script per creare le URL delle immagini per il sito Abbraccio
// Queste sono immagini professionali da Unsplash (gratuite e di alta qualità)

const images = {
    // Hero Image - Assistenza domiciliare professionale
    hero: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    
    // About Image - Team di professionisti
    about: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    
    // Servizi
    servizi: {
        infermieristica: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        riabilitazione: 'https://images.unsplash.com/photo-1581009146145-b5ef025c2f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        anziani: 'https://images.unsplash.com/photo-1577567912248-23a4a1c6c9e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        pazienti: 'https://images.unsplash.com/photo-1516549655169-df3a4f6b8c9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        notturno: 'https://images.unsplash.com/photo-1532938911079-1b38ac3458e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
        hospice: 'https://images.unsplash.com/photo-1584467722069-0c5f58a8bd8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    
    // Careers Image
    careers: 'https://images.unsplash.com/photo-1512909006721-3d395f9e1f6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    
    // Open Graph Image
    og: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    
    // Favicon
    favicon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzFlNGQ4YyIvPgogIDxwYXRoIGQ9Ik0xNiAyNEMxNiAyNCA2IDE2IDYgMTJDNiA4IDkgNSAxMiA1QzE0IDUgMTYgNiAxNiA4QzE4IDYgMjAgNSAyMiA1QzI1IDUgMjggOCAyOCAxMkMyOCAxNiAyMCAyNCAxNiAyNFoiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE2LCAxNikiPgogICAgPHJlY3QgeD0iLTEiIHk9IjYiIHdpZHRoPSIyIiBoZWlnaHQ9IjEyIiBmaWxsPSIjMWU0ZDhjIiByeD0iMSIvPgogICAgPHJlY3QgeD0iLTYiIHk9IjEiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyIiBmaWxsPSIjMWU0ZDhjIiByeD0iMSIvPgogIDwvZz4KPC9zdmc+'
};

console.log('Immagini professionali per Abbraccio Cure Domiciliari:');
console.log(images);
