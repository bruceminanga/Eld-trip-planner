# ==============================================================================
# 1. ALB Security Group (The Front Gate Bouncer)
# ==============================================================================
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-sg-"
  description = "Security Group for Application Load Balancer"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow inbound HTTP from internet"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "to_backends" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow traffic from ALB to backend targets"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ==============================================================================
# 2. The Application Load Balancer (The Reception Desk)
# ==============================================================================
resource "aws_lb" "this" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# ==============================================================================
# 3. Target Group (The Pool of Servers/Pods Being Monitored)
# ==============================================================================
resource "aws_lb_target_group" "app" {
  # AWS enforces a 6-character limit on target group name_prefix (e.g. "dev-", "prod-", "stag-")
  name_prefix = "${substr(var.environment, 0, 4)}-"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = var.target_type

  health_check {
    enabled             = true
    path                = var.health_check_path
    protocol            = "HTTP"
    port                = "traffic-port"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-app-tg"
  }
}

# ==============================================================================
# 4. Listener (Routing Incoming Traffic to Target Group)
# ==============================================================================
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ==============================================================================
# 5. Target Group Attachment (Optional: Registers EC2 ID or EKS/ECS IP)
# ==============================================================================
resource "aws_lb_target_group_attachment" "app" {
  count            = var.target_id != "" ? 1 : 0
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = var.target_id
  port             = var.app_port
}