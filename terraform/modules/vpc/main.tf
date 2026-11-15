# ==============================================================================
# 1. The House (VPC)
# ==============================================================================
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-custom-vpc"
  }
}

# ==============================================================================
# 2. The Front Door or Main Gate (Internet Gateway)
# ==============================================================================
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.environment}-internet-gateway"
  }
}

# ==============================================================================
# 3. The Public Living Rooms (Public Subnets across 2 Availability Zones)
# ==============================================================================
# Zone A Public Subnet
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_a_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet-a"
  }
}

# Zone B Public Subnet (Required for the Application Load Balancer)
resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_b_cidr
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet-b"
  }
}

# ==============================================================================
# 4. Public Direction Signs & Wiring (Public Route Table + Associations)
# ==============================================================================
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${var.environment}-public-route-table"
  }
}

# Wire Zone A to the public road sign
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

# Wire Zone B to the public road sign
resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ==============================================================================
# 5. The Private Back Bedrooms (Private Subnets for Databases/Internal Workloads)
# ==============================================================================
# Zone A Private Subnet
resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.private_subnet_a_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.environment}-private-subnet-a"
  }
}

# Zone B Private Subnet
resource "aws_subnet" "private_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.private_subnet_b_cidr
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.environment}-private-subnet-b"
  }
}

# ==============================================================================
# 6. The House Wi-Fi Router (NAT Gateway + Private Route Table)
# ==============================================================================
# Elastic IP for the NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${var.environment}-nat-eip"
  }
}

# The NAT Gateway sits in Public Subnet A
resource "aws_nat_gateway" "this" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id # <--- Fixed [0]
  subnet_id     = aws_subnet.public_a.id

  tags = {
    Name = "${var.environment}-nat-gateway"
  }

  depends_on = [aws_internet_gateway.this]
}

# Private Route Table (No inline route here; created empty)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.environment}-private-route-table"
  }
}

# Wire both private bedrooms to the private route table
resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# Only add the internet route to private subnets IF NAT Gateway is enabled
resource "aws_route" "private_nat" {
  count                  = var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[0].id
}