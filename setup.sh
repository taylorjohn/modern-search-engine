#!/bin/bash
# setup.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Setting up Modern Search Engine...${NC}"

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
npm install @radix-ui/react-dialog \
           @radix-ui/react-slot \
           class-variance-authority \
           clsx \
           lucide-react \
           tailwind-merge \
           tailwindcss-animate \
           react-dropzone

# Create necessary directories
echo -e "\n${GREEN}Creating directory structure...${NC}"
mkdir -p src/{components/{document,search,ui},contexts,hooks,lib,pages,styles}

# Copy files to their locations
echo -e "\n${GREEN}Copying files to their locations...${NC}"
# Note: You'll need to replace these with actual copy commands for your files

# Set up environment variables
echo -e "\n${GREEN}Creating environment file...${NC}"
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:3030/api
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_TYPES=pdf,html,txt
EOL

echo -e "\n${GREEN}Setup completed!${NC}"
echo -e "You can now start the development server with: ${YELLOW}npm run dev${NC}"
