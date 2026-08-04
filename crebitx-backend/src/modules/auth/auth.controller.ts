import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ConfirmOtpDto } from './dto/otp.dto';
import { VerifyEmailTokenDto, ResendVerificationDto } from './dto/email-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary:
      'Register a new user and tenant. Sends an email verification link; login is blocked until it is confirmed.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully, verification email sent',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  // --- Email verification (public: caller has no session until verified) ---

  @Get('verify-email')
  @ApiOperation({ summary: 'Confirm an email verification link' })
  async verifyEmail(@Query() query: VerifyEmailTokenDto) {
    return await this.emailVerificationService.verifyToken(query.token);
  }

  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification link' })
  async resendVerificationEmail(@Body() dto: ResendVerificationDto) {
    return await this.emailVerificationService.resend(dto.email);
  }

  // --- Password reset (public) ---

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.passwordResetService.requestReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset link token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }

  // --- Phone verification (authenticated, SMS OTP) ---

  @Get('verify/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get phone/email verification status for the current user' })
  async getVerificationStatus(@CurrentUser('id') userId: string) {
    return await this.otpService.getStatus(userId);
  }

  @Post('verify/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a phone verification OTP (SMS) to the current user' })
  async sendVerificationOtp(@CurrentUser('id') userId: string) {
    return await this.otpService.sendOtp(userId);
  }

  @Post('verify/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a phone verification OTP for the current user' })
  async confirmVerificationOtp(@CurrentUser('id') userId: string, @Body() dto: ConfirmOtpDto) {
    return await this.otpService.confirmOtp(userId, dto.code);
  }
}
